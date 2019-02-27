'use strict';

/**
 * @author Wei Zheng
 * @description notification method used across multiple controllers
 */

const Notification = use('App/Models/Notification');
const Database = use('Database');
const MyHelper = use('App/Helper/MyHelper');

class NotificationService {
  /**
   * notify every admin
   */
  static async _notifyAdmin(computeList) {
    //get all admins
    const adminList = await Database.table('users')
      .select('id')
      .where('role', 'Admin')
      .orWhere('role', 'Developer');

    // fill change request data
    const notifyList = computeList(adminList.length);

    //notify every admin
    for (let i = 0; i < adminList.length; i++) {
      notifyList[i].user_id = adminList[i].id;
    }

    //save data to datatabse
    Notification.createMany(notifyList);
  }

  /**
   * notify a new change request was created
   */
  static async newRegisterCode({ role, creator_name }) {
    //notify all admin
    this._notifyAdmin(length => {
      // call back function to fill array with resource data
      return new Array(length).fill().map(a => ({
        user_id: null,
        content: `New ${role.toLowerCase()} registeration code was created by ${creator_name}`,
        icon: 'fa-user-plus'
      }));
    });
  }

  /**
   * notify a new change request was created
   */
  static async newUser({ id, full_name, role }) {
    //notify all admin
    this._notifyAdmin(length => {
      if (role !== 'Admin' && role !== 'Developer') {
        // notify client himself if he is a client
        length++;
      }
      // call back function to fill array with resource data
      return new Array(length).fill().map(a => ({
        user_id: id,
        content: `${full_name} has joined as a ${role.toLowerCase()}`,
        icon: 'fa-sign-in'
      }));
    });
  }

  /**
   * notify a new change request was created
   */
  static async newChangeRequest({ user_id, id, clientName }) {
    //notify all admin
    this._notifyAdmin(length => {
      // call back function to fill array with resource data
      const notifyList = new Array(length + 1).fill().map(a => ({
        user_id: user_id,
        change_request_id: id,
        content: `CR #${id} was created by ${clientName}`,
        icon: 'fa-upload text-blue',
        link: `/change-request/${id}/content`
      }));
      return notifyList;
    });
  }

  /**
   * notify every admin when new change request was created
   */
  static async updateChangeRequest({ user_id, id }, type) {
    let icon = '';
    let detail = 'content was modified';
    let link = 'history';
    // notify detail by update type
    switch (type) {
      case 'New Status: TO DO':
        icon = 'text-yellow fa-spinner';
        detail = 'status was set to TO DO';
        break;
      case 'New Status: IN PROGRESS':
        icon = 'text-blue fa-refresh';
        detail = 'status was set to IN PROGRESS';
        break;
      case 'New Status: COMPLETE':
        icon = 'text-green fa-check';
        detail = 'was COMPLETED';
        break;
      case 'New Status: CANCELLED':
        icon = 'text-red fa-ban';
        detail = 'was CANCELLED';
        break;
      default:
        // content edit
        icon = 'fa-edit';
        link = 'content';
        break;
    }

    //create notification
    Notification.create({
      user_id: user_id,
      change_request_id: id,
      content: `CR #${id} ${detail}`,
      icon: icon,
      link: `/change-request/${id}/${link}`
    });
  }

  /**
   * return datatable json for notification list
   * @return {Datatable JSON}
   */
  static async notificationPaginate(user, request) {
    return await MyHelper.mapDatatableFrom(
      request,
      // callback function to perform custom query
      (table, page, search) =>
        Notification.query()
          .where('user_id', user.id)
          .andWhere(function() {
            this.where('created_at', 'like', search).orWhere(
              'content',
              'like',
              search
            );
          })
          .orderBy(
            table.columns[table.order[0].column].data,
            table.order[0].dir
          )
          .paginate(page, table.length)
    );
  }

  /**
   * @return {notification list object}
   */
  static async getNotification(user) {
    const notifyList_old = await user
      .notifications()
      .where('isNew', '0')
      .orderBy('created_at', 'desc')
      .fetch();
    const notifyList_new = await user
      .notifications()
      .where('isNew', '1')
      .orderBy('created_at', 'desc')
      .fetch();

    return {
      new: notifyList_new,
      old: notifyList_old
    };
  }

  /**
   * @return {notification list object}
   */
  static async updateNotification(user, target) {
    if (target === 'all') {
      // set isNew to false for every new notification.
      await Database.table('notifications')
        .where('user_id', user.id)
        .where('isNew', true)
        .update('isNew', false);
    } else {
      //set isNew to false for single notification
      await Database.table('notifications')
        .where('user_id', user.id)
        .where('id', target)
        .update('isNew', false);
    }
  }
}

module.exports = NotificationService;